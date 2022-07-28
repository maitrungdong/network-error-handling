import { RetrySchema, ZPCRequestSchema } from '../declares/types'
import zpcClient from '../zpcClient'

class ConversationsAPIDataSource {
  getConverById(converId: number) {
    const retrySchemas: RetrySchema[] = [
      {
        maxRetries: 1,
        msBackoff: 100,
        errorCodes: [400, 404],
      },
      {
        maxRetries: 5,
        msBackoff: 200,
        errorCodes: [403, 500],
      },
      {
        maxRetries: 10,
        msBackoff: 300,
        errorCodes: [502, 503],
      },
    ]

    const request: ZPCRequestSchema = {
      requestConfig: {
        params: {
          converId,
        },
      },
      shouldHold: true,
      waitNetworkTime: 'infinite', // inifinite || 3600 seconds
      retrySchemas,
    }

    const pendingRequest = zpcClient.get('/conversations', request)
  }
}
