import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const DynamoDB = new AWS.DynamoDB.DocumentClient();

const EVENT_TABLE = process.env.ASSET_TRACKING_EVENT_TABLE;

exports.index = async (event: any, context: any) => {
  event.Records.forEach(async (record: any) => {
    const message: any = Buffer.from(record.kinesis.data, "base64").toString(
      "ascii"
    );

    const messageObj = message && JSON.parse(message);
    console.log("Message: ", messageObj);

    /**
     *
     * { 
        "event": {
          "timestamp": 1641236771000,
          "coords": {
            "altitude": 22,
            "heading": 88.85652923583984,
            "altitudeAccuracy": 1.352531909942627,
            "latitude": 60.2206052,
            "speed": 0.05107331648468971,
            "longitude": 25.1273745,
            "accuracy": 10.107999801635742
          }
        }
      }        
     *
     */
    // push data into DynamoDB location tracking table
    if (messageObj) {
      const payload = {
        ...messageObj.coords,
        id: uuidv4(),
        assetTimestamp: messageObj.timestamp,
        timestamp: Date.now(),
        userId: "123",
        fleetId: "234",
      };
      console.log("Message: ", payload, EVENT_TABLE);
      try {
        await put({ TableName: EVENT_TABLE, Item: payload });
      } catch (error) {
        console.log(
          "Save Asset Tracking Event failed. Check the error message",
          error
        );
      }
    }
    return message;
  });
  // push raw data into Kinesis Data Firehose

  return {
    message: "The asset process event was received successful",
  };
};

const put = async ({ TableName, Item = {} }: any) => {
  await DynamoDB.put({ TableName, Item }).promise();
};
