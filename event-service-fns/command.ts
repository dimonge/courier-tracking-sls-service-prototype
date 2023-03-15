import * as AWS from "aws-sdk";
import partnerResolvers from "./utils/partnerApiResolvers";

const Kinesis = new AWS.Kinesis();

type CommandEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    type: string;
    data: Record<string, unknown>;
  };
};

const eventName = process.env.STREAM_NAME;

exports.index = async (
  event: CommandEvent,
  context: any
): Promise<Record<string, unknown> | null | undefined> => {
  console.log("Events: ", event);
  console.log("Context: ", context);
  /**
   * {
   * event: {
   *    type: 'createNewDelivery|updateDelivery|deleteDelivery',
   *    data:   {
   *           ...
   *       },
   *    }
   * }
   */
  // get the data

  const payload = partnerResolvers({
    type: event.arguments.type,
    data: event.arguments.data,
  });

  const request = {
    Data: JSON.stringify({
      event: event.arguments.type,
      data: payload,
    }),
    PartitionKey: "2",
    StreamName: eventName as string,
  };
  console.log("request: ", request);
  await Kinesis.putRecord(request, (error, data) => {
    if (error) {
      console.error("Error occurred: ", error);
    }
    console.log("EVENT DATA: ", data);
  }).promise();
  return {
    message: "The command event is successful",
  };
};
