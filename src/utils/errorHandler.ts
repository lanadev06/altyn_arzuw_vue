import type { ApiError } from '../types/api'

// Типы ошибок
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

// Интерфейс для обработанной ошибки
export interface ProcessedError {
  type: ErrorType
  message: string
  originalError?: unknown
  status?: number
  validationErrors?: Record<string, string[]>
}

// Класс для обработки ошибок API
export class ApiErrorHandler {
  /**
   * Обрабатывает ошибку API и возвращает структурированную ошибку
   */
  static processError(error: unknown): ProcessedError {
    // Если это уже обработанная ошибка
    if (this.isProcessedError(error)) {
      return error
    }

    // Если это объект с полем response (axios-like error)
    if (this.isAxiosLikeError(error)) {
      return this.processAxiosLikeError(error)
    }

    // Если это объект с полем status (fetch-like error)
    if (this.isFetchLikeError(error)) {
      return this.processFetchLikeError(error)
    }

    // Если это строка
    if (typeof error === 'string') {
      return {
        type: ErrorType.UNKNOWN,
        message: error,
      }
    }

    // Если это Error объект
    if (error instanceof Error) {
      return {
        type: ErrorType.UNKNOWN,
        message: error.message,
        originalError: error,
      }
    }

    // По умолчанию
    return {
      type: ErrorType.UNKNOWN,
      message: 'Неизвестная ошибка',
      originalError: error,
    }
  }

  /**
   * Проверяет, является ли ошибка уже обработанной
   */
  private static isProcessedError(error: unknown): error is ProcessedError {
    return typeof error === 'object' && error !== null && 'type' in error && 'message' in error
  }

  /**
   * Проверяет, является ли ошибка axios-like
   */
  private static isAxiosLikeError(
    error: unknown,
  ): error is { response?: { status: number; data?: unknown } } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as any).response === 'object' &&
      (error as any).response !== null
    )
  }

  /**
   * Проверяет, является ли ошибка fetch-like
   */
  private static isFetchLikeError(error: unknown): error is { status: number; statusText: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof (error as any).status === 'number'
    )
  }

  /**
   * Обрабатывает axios-like ошибки
   */
  private static processAxiosLikeError(error: {
    response?: { status: number; data?: unknown }
  }): ProcessedError {
    const status = error.response?.status || 0
    const data = error.response?.data

    // Обработка валидационных ошибок Laravel
    if (status === 422 && this.isValidationError(data)) {
      return {
        type: ErrorType.VALIDATION,
        message: 'Ошибка валидации данных',
        status,
        validationErrors: data.errors,
      }
    }

    // Обработка ошибок аутентификации
    if (status === 401) {
      return {
        type: ErrorType.AUTHENTICATION,
        message: 'Ошибка аутентификации',
        status,
      }
    }

    // Обработка ошибок авторизации
    if (status === 403) {
      return {
        type: ErrorType.AUTHORIZATION,
        message: 'Доступ запрещен',
        status,
      }
    }

    // Обработка ошибок "не найдено"
    if (status === 404) {
      return {
        type: ErrorType.NOT_FOUND,
        message: 'Ресурс не найден',
        status,
      }
    }

    // Обработка серверных ошибок
    if (status >= 500) {
      return {
        type: ErrorType.SERVER_ERROR,
        message: 'Ошибка сервера',
        status,
      }
    }

    // Обработка сетевых ошибок
    if (status === 0) {
      return {
        type: ErrorType.NETWORK,
        message: 'Ошибка сети',
      }
    }

    return {
      type: ErrorType.UNKNOWN,
      message: this.extractMessage(data) || 'Неизвестная ошибка',
      status,
    }
  }

  /**
   * Обрабатывает fetch-like ошибки
   */
  private static processFetchLikeError(error: {
    status: number
    statusText: string
  }): ProcessedError {
    const { status, statusText } = error

    if (status === 401) {
      return {
        type: ErrorType.AUTHENTICATION,
        message: 'Ошибка аутентификации',
        status,
      }
    }

    if (status === 403) {
      return {
        type: ErrorType.AUTHORIZATION,
        message: 'Доступ запрещен',
        status,
      }
    }

    if (status === 404) {
      return {
        type: ErrorType.NOT_FOUND,
        message: 'Ресурс не найден',
        status,
      }
    }

    if (status >= 500) {
      return {
        type: ErrorType.SERVER_ERROR,
        message: 'Ошибка сервера',
        status,
      }
    }

    return {
      type: ErrorType.UNKNOWN,
      message: statusText || 'Неизвестная ошибка',
      status,
    }
  }

  /**
   * Проверяет, является ли ошибка валидационной
   */
  private static isValidationError(data: unknown): data is { errors: Record<string, string[]> } {
    return (
      typeof data === 'object' &&
      data !== null &&
      'errors' in data &&
      typeof (data as any).errors === 'object'
    )
  }

  /**
   * Извлекает сообщение об ошибке из данных
   */
  private static extractMessage(data: unknown): string | null {
    if (typeof data === 'string') {
      return data
    }

    if (typeof data === 'object' && data !== null) {
      if ('message' in data && typeof (data as any).message === 'string') {
        return (data as any).message
      }

      if ('error' in data && typeof (data as any).error === 'string') {
        return (data as any).error
      }
    }

    return null
  }

  /**
   * Получает человекочитаемое сообщение об ошибке
   */
  static getReadableMessage(error: ProcessedError): string {
    switch (error.type) {
      case ErrorType.VALIDATION:
        if (error.validationErrors) {
          const messages = Object.values(error.validationErrors).flat()
          return messages.join(', ')
        }
        return error.message

      case ErrorType.AUTHENTICATION:
        return 'Необходимо войти в систему'

      case ErrorType.AUTHORIZATION:
        return 'У вас нет прав для выполнения этого действия'

      case ErrorType.NOT_FOUND:
        return 'Запрашиваемый ресурс не найден'

      case ErrorType.NETWORK:
        return 'Проблема с подключением к серверу'

      case ErrorType.SERVER_ERROR:
        return 'Внутренняя ошибка сервера'

      default:
        return error.message || 'Произошла неизвестная ошибка'
    }
  }

  /**
   * Логирует ошибку в консоль (только в development)
   */
  static logError(error: ProcessedError): void {
    if (import.meta.env.DEV) {
      console.group('API Error')
      console.error('Type:', error.type)
      console.error('Message:', error.message)
      console.error('Status:', error.status)
      if (error.validationErrors) {
        console.error('Validation Errors:', error.validationErrors)
      }
      if (error.originalError) {
        console.error('Original Error:', error.originalError)
      }
      console.groupEnd()
    }
  }
}

// Утилиты для работы с ошибками
export const errorUtils = {
  /**
   * Создает обработчик ошибок для async функций
   */
  withErrorHandling: <T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    errorHandler?: (error: ProcessedError) => void,
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args)
      } catch (error) {
        const processedError = ApiErrorHandler.processError(error)
        ApiErrorHandler.logError(processedError)

        if (errorHandler) {
          errorHandler(processedError)
        }

        throw processedError
      }
    }
  },

  /**
   * Проверяет, является ли ошибка определенного типа
   */
  isErrorType: (error: ProcessedError, type: ErrorType): boolean => {
    return error.type === type
  },

  /**
   * Получает валидационные ошибки
   */
  getValidationErrors: (error: ProcessedError): Record<string, string[]> | null => {
    return error.validationErrors || null
  },
}
