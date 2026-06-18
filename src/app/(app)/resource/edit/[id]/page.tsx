import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SupabaseResourceRepository } from '@/backend/infrastructure/supabase/SupabaseResourceRepository';
import { GetResourceUseCase } from '@/backend/application/use-cases/GetResourceUseCase';
import Navbar from '@/components/layout/Navbar';
import ResourceForm from '@/features/resources/components/ResourceForm';

interface EditResourcePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditResourcePage({ params }: EditResourcePageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const resourceRepo = new SupabaseResourceRepository(supabase);
  const getResourceUseCase = new GetResourceUseCase(resourceRepo);

  let resource;
  try {
    // 1. Obtener recurso
    resource = await getResourceUseCase.execute({ id });
  } catch (error) {
    console.error('Error recuperando recurso para edición:', error);
    return notFound();
  }

  // 2. Verificar autenticación y autoría
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== resource.authorId) {
    redirect(`/resource/${resource.slug}`);
  }

  // Mapear la entidad de dominio a un objeto plano compatible con el formulario
  const resourceData = {
    id: resource.id,
    title: resource.title,
    slug: resource.slug,
    description: resource.description,
    content: resource.content,
    type: resource.type,
    status: resource.status,
    categoryId: resource.categoryId,
    compatibleModels: resource.compatibleModels,
    exampleInput: resource.exampleInput,
    exampleOutput: resource.exampleOutput,
    metadata: resource.metadata,
    tags: resource.tags,
    files: resource.files,
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 flex flex-col items-center">
        <ResourceForm initialData={resourceData} isEdit={true} />
      </main>
    </div>
  );
}
