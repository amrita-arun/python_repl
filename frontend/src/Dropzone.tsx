import React, { useState } from 'react';
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import type { FileWithPath, FileRejection } from "@mantine/dropzone";
import { Text, Group, Button, useMantineTheme, Notification } from '@mantine/core';

interface DropzoneUploaderProps {
    onUpload: (submissionId: string) => void;
}
export default function DropzoneUploader({ onUpload }: DropzoneUploaderProps ) {
    const theme = useMantineTheme();
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleDrop(files: FileWithPath[]) {
        setUploadError(null);
        setUploadSuccess(null);

        const zipFile = files[0];
        const formData = new FormData();
        formData.append('file', zipFile, zipFile.name);

        try {
            setLoading(true);
            const res = await fetch('http://localhost:3000/submissions/upload', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Upload failed: ${res.status}: ${text}`)
    
            }
            const json = (await res.json()) as { message: string };
            setUploadSuccess(json.message)

            const zipname = zipFile.name;
            const submissionId = zipname.replace(/\.zip$/i, '')
            onUpload(submissionId);
        } catch (err: any) {
            console.error(err);
            setUploadError(err.message)
        } finally {
            setLoading(false);
        }
    
        
    };

    const handleReject = (fileRejections: FileRejection[]) => {
        setUploadError('Only .zip files under 10 MB are allowed');
    }

    return (
        <div style={{ padding: 20 }} >
            <Text size="xl" w={500} >
                Upload Student Submission
            </Text>

            <Dropzone
                onDrop={handleDrop}
                onReject={handleReject}
                maxSize={30 * 1024 ** 2} // 30 MB
                accept={['application/zip', '.zip']}
                disabled={loading}
                style={{
                  marginTop: 20,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: theme.colors.blue[6],
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.xl,
                }}
            >
                <Group justify="center" gap="xl" style={{ minHeight: 100, pointerEvents: 'none' }}>
                    <Text size="lg" c={theme.colors.gray[6]}>
                    Drag ZIP here, or click to select
                    </Text>
                </Group>
            </Dropzone>
            {loading && (
                <Text ta="center" style={{ marginTop: 15 }}>
                Uploading…
                </Text>
            )}

            {uploadError && (
                    <Notification color="red" onClose={() => setUploadError(null)} style={{ marginTop: 15 }}>
                    {uploadError}
                    </Notification>
            )}

            {uploadSuccess && (
                <Notification color="teal" onClose={() => setUploadSuccess(null)} style={{ marginTop: 15 }}>
                {uploadSuccess}
                </Notification>
            )}
        </div>
    )
}

export { DropzoneUploader };
