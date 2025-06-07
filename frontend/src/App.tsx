import React, { useState } from 'react'
import './App.css'
import '@mantine/core/styles.css'
import Terminal from './Terminal'
import DropzoneUploader from './Dropzone'

function App() {
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  return (
    <div>
      <DropzoneUploader onUpload={(id: string) => setSubmissionId(id)}/>
      <Terminal submissionId={submissionId}/>
    </div>
    
    
  )
}

export default App
