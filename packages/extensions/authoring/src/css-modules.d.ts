declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

declare module '*.csv?raw' {
  const content: string
  export default content
}
