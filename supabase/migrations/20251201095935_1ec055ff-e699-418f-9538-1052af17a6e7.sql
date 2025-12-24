-- Ajouter une politique pour permettre aux étudiants de mettre à jour leurs propres candidatures
CREATE POLICY "Students can update their own applications"
ON applications
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);