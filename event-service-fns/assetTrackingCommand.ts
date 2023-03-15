import * as AWS from "aws-sdk";

const Kinesis = new AWS.Kinesis();

type CommandEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    event: {
      type: string;
      data: Record<string, unknown>;
    };
  };
};
const eventName: any = process.env.ASSET_STREAM_NAME;

exports.index = async (event: CommandEvent, context: any) => {
  console.log("Event: ", event);
  const data =
    event &&
    event.arguments &&
    event.arguments.event &&
    event.arguments.event.data;
  if (data) {
    let request = {
      Data: JSON.stringify(data),
      PartitionKey: "2",
      StreamName: eventName,
    };
    console.log("event: ", request);
    await Kinesis.putRecord(request, (error, data) => {
      if (error) {
        console.error("Error occurred. ", error);
      }
      console.log("Location data", data);
    }).promise();
  }

  return {
    statusCode: 200,
    message: "The asset command event is successful",
  };
};
