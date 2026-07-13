# Apps Script — CHANGELOG (Base)

Snapshots congelados del `apps-script.gs` desplegado. `SCRIPT_VERSION` en el
código = versión activa (verificable con `?action=ping`).

| Versión | Fecha | Cambios |
|---------|-------|---------|
| v1 | 2026-07-01 | Base inicial: concurrencia (withLock), upsertSucursal/deleteSucursal, SCRIPT_VERSION en ping |
| v2 | 2026-07-13 | Módulo Medidores: hojas Medidores/Lecturas Medidor/Precios Medidor (getSheetRows/setSheetRows + acciones get/set), uploadFile con subfolders, deleteFile (papelera Drive) |
