const AWSXRay = require("aws-xray-sdk-core");
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, QueryCommand, UpdateCommand, DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {
  constructor(
    private readonly docClient: DynamoDBDocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET
    ) {}

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
    logger.info(`List todo item of user(${userId}) is ${JSON.stringify(items)}`);
    return items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    const command = new PutCommand({
      TableName: this.todosTable,
      Item: todo
    })
    await this.docClient.send(command)
    logger.info(`Create successful new todo item ${JSON.stringify(todo)}`);
    return todo
  }

  async deleteTodo(todoId: string, userId: string): Promise<null> {
    const command = new DeleteCommand({
      TableName: this.todosTable,
      Key: { userId, todoId }
    })
    await this.docClient.send(command)
    logger.info(`Delete successful todo item ${todoId}`);
    return null
  }

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
    logger.info(`Update successful todo item(${todoId})  ${JSON.stringify(updateItem)}`);

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
    logger.info(`Presign Url For Todo Item ${todoId} successful!`);
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
