import React, { useState } from 'react'
import './App.css'
import '@mantine/core/styles.css'
import Terminal from './Terminal'
import DropzoneUploader from './Dropzone'
import { OpenTerminalButton } from './OpenTerminalButton'

function App() {
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  return (
    <div>
      <OpenTerminalButton
        submissionId="hw10_pham_ceci"
        ecsRunEndpoint="http://localhost:3000/ecs/run"
      />
      {/*<DropzoneUploader onUpload={(id: string) => setSubmissionId(id)}/> */}
     {/* <!-- <Terminal submissionId={submissionId}/>  */}
    </div>
    
    
  )
}

export default App
