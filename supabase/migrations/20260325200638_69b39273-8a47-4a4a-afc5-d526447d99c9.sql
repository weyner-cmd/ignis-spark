
-- Allow fiel to insert themselves as 'membro' in pastoral_members
CREATE POLICY "pastoral_members_insert_self"
ON public.pastoral_members
FOR INSERT
TO authenticated
WITH CHECK (
  person_id = auth.uid()
  AND role = 'membro'
  AND get_my_tenant_id() = tenant_id
);

-- Allow fiel to delete their own 'membro' membership
CREATE POLICY "pastoral_members_delete_self"
ON public.pastoral_members
FOR DELETE
TO authenticated
USING (
  person_id = auth.uid()
  AND role = 'membro'
);

-- Allow coordinators/vice to insert events for their group
CREATE POLICY "pastoral_events_insert_coordinator"
ON public.pastoral_events
FOR INSERT
TO authenticated
WITH CHECK (
  get_my_tenant_id() = tenant_id
  AND EXISTS (
    SELECT 1 FROM public.pastoral_members
    WHERE pastoral_members.group_id = pastoral_events.group_id
      AND pastoral_members.person_id = auth.uid()
      AND pastoral_members.role IN ('coordenador', 'vice_coordenador')
  )
);
