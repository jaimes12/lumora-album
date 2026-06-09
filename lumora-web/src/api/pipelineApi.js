import { api } from './apiClient'

export const pipelineApi = {
  getStages:  ()       => api.get('/api/pipeline-stages'),
  saveStages: (stages) => api.put('/api/pipeline-stages', stages),
}
