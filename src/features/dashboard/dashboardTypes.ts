export type HealthResponse = {
  data: {
    name: string
    status: string
    version: string
  }
}

export type ApiHealth = HealthResponse['data']
