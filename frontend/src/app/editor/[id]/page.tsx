import EditorClient from '@/features/editor/components/EditorClient';

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <EditorClient projectId={id} />
  );
}
