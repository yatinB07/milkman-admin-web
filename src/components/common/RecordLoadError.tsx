import { MasterPageHeader } from '../master'
import { Button } from './Button'

type RecordLoadErrorProps = {
  title: string
  description: string
  message: string
  backLabel: string
  onBack: () => void
}

export function RecordLoadError({ title, description, message, backLabel, onBack }: RecordLoadErrorProps) {
  return (
    <>
      <MasterPageHeader
        title={title}
        description={description}
        actions={
          <Button variant="secondary" size="compact" onClick={onBack}>
            {backLabel}
          </Button>
        }
      />
      <div className="master-error">{message}</div>
    </>
  )
}
