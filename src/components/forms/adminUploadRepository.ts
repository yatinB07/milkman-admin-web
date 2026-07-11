import { api } from '../../lib/api'

type AdminUploadResponse = {
  data: {
    path: string
    url: string
  }
}

export async function uploadAdminFile(file: File, directory: string) {
  const formData = new FormData()
  formData.append('directory', directory)
  formData.append('file', file)

  const response = await api.post<AdminUploadResponse>('/api/v1/admin/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data.data
}
