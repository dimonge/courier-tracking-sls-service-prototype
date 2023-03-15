import * as cdk from "@aws-cdk/core";
import * as appSync from "@aws-cdk/aws-appsync";
import * as kinesis from "@aws-cdk/aws-kinesis";
import * as lambda from "@aws-cdk/aws-lambda";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import { KinesisEventSource } from "@aws-cdk/aws-lambda-event-sources";
import { StartingPosition } from "@aws-cdk/aws-lambda";

interface MoCourierAssetTrackingStackProps extends cdk.StackProps {
  resourceStage: string;
  stage: string;
}
export class MoCourierAssetTrackingStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props?: MoCourierAssetTrackingStackProps
  ) {
    super(scope, id, props);

    const assetTrackingCommandApi = new appSync.GraphqlApi(
      this,
      "assetTrackingCommandApi",
      {
        name: "asset-tracking-command-api",
        schema: appSync.Schema.fromAsset(
          "graphql/assetTrackingCommandApi/schema.graphql"
        ),
        authorizationConfig: {
          defaultAuthorization: {
            authorizationType: appSync.AuthorizationType.API_KEY,
            apiKeyConfig: {
              expires: cdk.Expiration.after(cdk.Duration.days(365)),
            },
          },
        },
        xrayEnabled: true,
      }
    );

    const assetStream = new kinesis.Stream(this, "assetTrackingStream", {
      streamName: "asset-tracking-stream",
    });

    const assetTrackingCommandFn = new lambda.Function(
      this,
      "assetTrackingCommandFn",
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        timeout: cdk.Duration.seconds(10),
        memorySize: 1024,
        code: new lambda.AssetCode("event-service-fns"),
        handler: "assetTrackingCommand.index",
        environment: {
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
          ASSET_STREAM_NAME: assetStream.streamName,
        },
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // Attach the datasource to the graphql API
    const assetTrackingCommandDs = assetTrackingCommandApi.addLambdaDataSource(
      "assetTrackingCommandDs",
      assetTrackingCommandFn
    );

    // resolver for the lambda datasource
    for (const resolver of assetTrackingCommandResolvers) {
      assetTrackingCommandDs.createResolver(resolver);
    }

    // grant write access to commandFn
    assetStream.grantWrite(assetTrackingCommandFn);
    const stage = props?.resourceStage;
    const isDevStage = stage === "dev";
    const removalPolicy = isDevStage
      ? cdk.RemovalPolicy.DESTROY
      : cdk.RemovalPolicy.RETAIN;

    const assetTrackingEvents = new dynamodb.Table(
      this,
      "AssetTrackingEvents",
      {
        partitionKey: {
          name: "timestamp",
          type: dynamodb.AttributeType.NUMBER,
        },
        sortKey: { name: "userId", type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy,
      }
    );
    const processEventFn = new lambda.Function(
      this,
      "assetTrackingProcessEventFn",
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        timeout: cdk.Duration.seconds(10),
        memorySize: 1024,
        code: new lambda.AssetCode("event-service-fns"),
        handler: "processAssetTracking.index",
        environment: {
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
          ASSET_TRACKING_EVENT_TABLE: assetTrackingEvents.tableName,
        },
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    processEventFn.addEventSource(
      new KinesisEventSource(assetStream, {
        startingPosition: StartingPosition.TRIM_HORIZON,
      })
    );

    // grant access to processEventFn to post data to asset tracking event table
    assetTrackingEvents.grantWriteData(processEventFn as any);

    new cdk.CfnOutput(this, "AssetTrackingCommandApiUrl", {
      value: assetTrackingCommandApi.graphqlUrl,
    });

    new cdk.CfnOutput(this, "AssetTrackingCommandApiKey", {
      value: assetTrackingCommandApi.apiKey || "",
    });

    new cdk.CfnOutput(this, "region", {
      value: this.region,
    });
  }
}

const assetTrackingCommandResolvers = [
  { typeName: "Query", fieldName: "getEvents" },
  { typeName: "Mutation", fieldName: "newEvent" },
];
