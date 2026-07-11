import { api } from '../../lib/api'
import type { ApiHealth, HealthResponse } from './dashboardTypes'

export async function getApiHealth(): Promise<ApiHealth> {
  const response = await api.get<HealthResponse>('/api/v1/health')

  return response.data.data
}
