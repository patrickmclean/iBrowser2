// Manage all database access

// AWS config update is called for every call
// Likely not efficient, add some session state at some point

const AWS = require('aws-sdk');
const config = require('../config/config.js');
const { imageClass } = require('./image.js');
const logger = require('./logger.js');

module.exports = {
  insert: function(item){
    logger.write('aws ddb ', 'log: '+item.filename,2);

    AWS.config.update(config.aws_remote_config);

    const docClient = new AWS.DynamoDB.DocumentClient();
    
    const params = {
      TableName: config.aws_table_name,
      Item: item
    };
    
    docClient.put(params, function(err, data) {
      if (err) {
          console.log('Error: Server error: '+err);
      } else {
        const { Items } = data;
      }
    });
  },
  
  readAll: async function() {
    logger.write('ddb','readAll',3);
    AWS.config.update(config.aws_remote_config);
    let docClient = new AWS.DynamoDB.DocumentClient();
    let params = {
        TableName: config.aws_table_name,
        //KeyConditionExpression: 'imageID = :i',
        //ExpressionAttributeValues: {
        //  ':i': '*',
        //}
    };
    let promise = docClient.scan(params).promise();
    let result = await promise;
    let data = result.Items;
    // can only read 1MB in a go, this is for multi-layer
    if (result.LastEvaluatedKey) {
      params.ExclusiveStartKey = result.LastEvaluatedKey;
      data = data.concat(await dbRead(params));
    }
    data.forEach(element => {
      logger.write('ddbreadAllresult',element,3);
    });
    return data;
    },
}
