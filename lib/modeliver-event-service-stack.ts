import * as cdk from '@aws-cdk/core';
import * as appSync from "@aws-cdk/aws-appsync"
import * as lambda from "@aws-cdk/aws-lambda"
import * as kinesis from "@aws-cdk/aws-kinesis"
import * as sqs from "@aws-cdk/aws-sqs"

import { KinesisEventSource, SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { StartingPosition } from '@aws-cdk/aws-lambda';

export class ModeliverEventServiceStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'ModeliverEventServiceQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    // Create the Graphql API for partner app

    const partnerCommandApi = new appSync.GraphqlApi(this, "partnerCommandApi", {
      name: "partner-command-api",
      schema: appSync.Schema.fromAsset("graphql/partnerCommandApi/schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appSync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365))
          }
        }
      },
      xrayEnabled: true
    })

    // Kinesis data stream that stores the events coming from the 
    const divineStream = new kinesis.Stream(this, "divineStream", {
      streamName: "divine-stream"
    })

    // Lambda function that is invoke when the appSync receives an event
    const commandFn = new lambda.Function(this, "partnerCommandFn", {
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: cdk.Duration.seconds(10),
      memorySize: 1024,
      code: new lambda.AssetCode("event-service-fns"),
      handler: "command.index",
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
        STREAM_NAME: divineStream.streamName,        
      },
      tracing: lambda.Tracing.ACTIVE
    })

    // Attach the datasource to the graphql API
    const partnerCommandDs = partnerCommandApi.addLambdaDataSource("partnerCommandDs", commandFn)

    // Attach the resolver to the graphql lambda data source
    for (const resolver of commandResolvers) {
      partnerCommandDs.createResolver(resolver)
    }

    
    
    // Grant write access to commandFn to add event to kinesis stream
    divineStream.grantWrite(commandFn)

    // SQS for saving data into postgresql
    const saveDataQueue = new sqs.Queue(this, "SaveDataSubscriberQueue", {      
      queueName: "SaveDataSubscriberQueue"
    })

    // add consumer event source that listens and fetch data from kinesis stream
    const processEventFn = new lambda.Function(this, "processEventFn", {
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: cdk.Duration.seconds(10),
      memorySize: 1024,    
      code: new lambda.AssetCode("event-service-fns"),
      handler: "process.index",
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
        SAVE_DATA_QUEUE_NAME: saveDataQueue.queueName,
        SAVE_DATA_QUEUE_URL: saveDataQueue.queueUrl
      },
      tracing: lambda.Tracing.ACTIVE
    })

    // add consumer that subscribe to event from kinesis stream
    
    processEventFn.addEventSource(new KinesisEventSource(divineStream, {
      startingPosition: StartingPosition.TRIM_HORIZON
    }))

    

    // lambda that is trigger to send data into Postgresql
    const sqsSaveDataSubscribeLambda = new lambda.Function(this, "sqsSaveDataSubscribeLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("event-service-fns"),
      timeout: cdk.Duration.seconds(10),
      handler: "saveTransactions.index",
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
        STREAM_NAME: divineStream.streamName,             
      },
      tracing: lambda.Tracing.ACTIVE
    })

    // Allow processEventFn to send message to queue
    saveDataQueue.grantSendMessages(processEventFn as any);

    // saveDataLambda get data from sqs
    const dataEventSource = new SqsEventSource(saveDataQueue as any)
    sqsSaveDataSubscribeLambda.addEventSource(dataEventSource)

    // Log the Api url to the command line
    new cdk.CfnOutput(this, "ParternCommandApiUrl", {
      value: partnerCommandApi.graphqlUrl
    })

    // Log the Api key to the command line
    new cdk.CfnOutput(this, "PartnerCommandApiKey", {
      value: partnerCommandApi.apiKey || ""
    })

    // log the region to the command line
    new cdk.CfnOutput(this, "region", {
      value: this.region
    })
  }

}

const commandResolvers = [
  {typeName: "Query", fieldName: "getEvents" },
  { typeName: "Mutation", fieldName: "newEvent" }
]