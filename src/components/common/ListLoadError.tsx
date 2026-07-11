type ListLoadErrorProps = {
  message: string
}

export function ListLoadError({ message }: ListLoadErrorProps) {
  return <div className="master-error">{message}</div>
}
