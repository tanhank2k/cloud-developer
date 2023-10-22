// import * as AWS from 'aws-sdk'
const AWSXRay = require("aws-xray-sdk-core");
// Transformation of DocumentClient named import from deep path is unsupported in aws-sdk-js-codemod.
// Please convert to a default import, and re-run aws-sdk-js-codemod.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, QueryCommand, UpdateCommand, DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
// import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

// const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {
  constructor(
    private readonly docClient: DynamoDBDocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET
    
    ) {
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    const command = new QueryCommand({
      TableName: this.todosTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });
    const result = await this.docClient.send(command)

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    const command = new PutCommand({
      TableName: this.todosTable,
      Item: todo
    })
    await this.docClient.send(command)
    return todo
  }

  //TODO response
  async deleteTodo(todoId: string, userId: string): Promise<null> {
    const command = new DeleteCommand({
      TableName: this.todosTable,
      Key: { userId, todoId }
    })
    await this.docClient.send(command)
    return null
  }

  //TODO :v
  /**
   * 
   * @param todo 
   * @returns 
   */
  async updateTodo(todoId: string, userId: string, updateItem: TodoUpdate): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.todosTable,
      Key: { userId, todoId },
      ConditionExpression: 'attribute_exists(todoId)',
      UpdateExpression: 'set #n = :n, dueDate = :due, done = :dn',
      ExpressionAttributeNames: { '#n': 'name' },
      ExpressionAttributeValues: {
        ':n': updateItem.name,
        ':due': updateItem.dueDate,
        ':dn': updateItem.done
      }
    })
    await this.docClient.send(command)
  }

  async updatePresignUrlForTodoItem(todoId: string, userId: string): Promise<string> {
    const command = new UpdateCommand({
      TableName: this.todosTable,
      Key: { userId, todoId },
      ConditionExpression: 'attribute_exists(todoId)',
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
      }
    })
    await this.docClient.send(command)
    return `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    const client = new AWSXRay.captureAWSv3Client(
      new DynamoDBClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      }))
    return DynamoDBDocumentClient.from(client);
  }
  return DynamoDBDocumentClient.from(new DynamoDBClient({}));
}
