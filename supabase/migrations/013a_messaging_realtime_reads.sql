-- Realtime sobre conversation_reads: sin esto el badge de no leídos no se
-- actualiza solo, hay que recargar para verlo cambiar.
--
-- Aplicada en producción el 2026-08-02 sin quedar versionada en el repo.
-- Se recupera acá con el sufijo "a" para respetar su lugar cronológico real
-- (va después de 013_messaging y antes de 014_conversations_per_family).
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_reads;
