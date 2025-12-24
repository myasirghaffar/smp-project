-- Allow students to delete their own applications
CREATE POLICY "Students can delete their own applications"
ON applications
FOR DELETE
TO authenticated
USING (auth.uid() = student_id);