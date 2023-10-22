import { TodoUpdate } from './../models/TodoUpdate';
import { TodosAccess } from '../dataLayer/todosAcess'
import { AttachmentUtils } from '../helpers/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
// import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'
import { parseUserId } from '../auth/utils';

// TODO: Implement businessLogic
const todosAccess = new TodosAccess()

export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    jwtToken: string
  ): Promise<TodoItem> {
  
    const itemId = uuid.v4()
    const userId = parseUserId(jwtToken)
  
    return await todosAccess.createTodo({
      todoId: itemId,
      userId: userId,
      name: createTodoRequest.name,
      dueDate: createTodoRequest.dueDate,
      done: false,
      createdAt: new Date().toISOString()
    })
  }

  
export async function deleteTodo(
  toDoId: string,
  jwtToken: string
): Promise<TodoItem> {

  const userId = parseUserId(jwtToken)

  return await todosAccess.deleteTodo(
    toDoId,
    userId
  )
}


export async function getTodosForUser(
  jwtToken: string
): Promise<TodoItem[]> {

  const userId = parseUserId(jwtToken)
  return await todosAccess.getAllTodos(userId)
}


export async function updateTodo(
  todoId: string,
  updateTodoRequest: UpdateTodoRequest,
  jwtToken: string
): Promise<void> {

  const userId = parseUserId(jwtToken)
  const updateItem: TodoUpdate = {...updateTodoRequest}
  await todosAccess.updateTodo(todoId, userId, updateItem)
}
  

export async function createAttachmentPresignedUrl(
  todoId: string,
  jwtToken: string
): Promise<string> {
  AttachmentUtils(todoId)
  const userId = parseUserId(jwtToken)
  const uploadUrl = await todosAccess.updatePresignUrlForTodoItem(todoId, userId);
  return uploadUrl
}
  

