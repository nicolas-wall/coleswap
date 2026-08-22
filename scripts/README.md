# Video de la landing (`public/demo.mp4`)

El recorrido que se ve en la home es una grabación real de la app, hecha con
Playwright sobre el colegio de prueba **Colegio San Martín** (el del seed
`003_seed.sql`). Nunca se graba sobre datos de familias reales.

Se graba en **viewport de teléfono** (390×844), porque en la landing va dentro
de un marco de celular, en la columna de al lado de los pasos de "Cómo
funciona".

## Regrabar

1. **Levantá la app con el código que querés mostrar.** Conviene hacerlo desde un
   worktree en el commit ya desplegado, para no filmar cambios a medio hacer ni
   migraciones sin aplicar:

   ```bash
   git worktree add ../coleswap-demo HEAD --detach
   cd ../coleswap-demo && npm install && cp ../SchoolShop/.env.local .
   npx next dev -p 3100
   ```

2. **Cargá los datos ficticios** (familias, catálogo, un hilo de chat). Es
   idempotente: borra y recrea las publicaciones demo en cada corrida, así que
   conviene ejecutarlo antes de *cada* grabación para limpiar lo que dejó la
   anterior.

   ```bash
   node scripts/seed-demo.mjs .env.local
   ```

3. **Grabá.** El script precalienta las rutas (`next dev` compila la primera
   visita a cada una) y después filma el recorrido con subtítulos y un puntero
   sintético.

   ```bash
   DEMO_OUT=./demo-out node scripts/record-demo.mjs
   ```

4. **Codificá** a MP4 y sacá el póster. El `-ss 1.0` descarta el skeleton de
   carga inicial y el `setpts` acelera un 30 % para que el recorrido no se haga
   largo:

   ```bash
   ffmpeg -y -ss 1.0 -i demo-out/demo.webm -vf "setpts=PTS/1.3,fps=25" -an \
     -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 25 -preset slow \
     -movflags +faststart public/demo.mp4
   ffmpeg -y -ss 2.0 -i public/demo.mp4 -frames:v 1 -q:v 3 public/demo-poster.jpg
   ```

   Verificá que el frame llene el cuadro antes de dar por buena la corrida:

   ```bash
   ffmpeg -y -ss 6 -i public/demo.mp4 -frames:v 1 /tmp/chk.png
   ```

## Detalles que importan

- **`recordVideo.size` solo sabe achicar.** El video sale al tamaño del viewport
  en px CSS y `deviceScaleFactor` no lo sube: si le pedís más que el viewport,
  Playwright no escala, rasteriza en la esquina y rellena el resto de gris. Por
  eso `size` va igual al viewport. El `deviceScaleFactor: 2` igual sirve, porque
  el frame se captura supersampleado y baja más limpio.
- Los subtítulos se dibujan a `bottom: 110px` a propósito: más abajo quedan
  tapados por la barra de controles del `<video>`. El caso ajustado es el
  teléfono en un viewport de 390 px, donde el video mide 244×528 y la barra de
  Chrome ocupa ~48 px fijos: `110/844 × 528 ≈ 69 px` de margen. Si movés esa
  posición, verificalo ahí y con el video en pausa (que es cuando la barra
  queda fija).
- El script oculta el indicador de `next dev` (logo, "Compiling…", contador de
  issues), que si no sale en cámara.
- La escena del ISBN depende de una API externa. El script verifica antes de
  grabar que `DEMO_ISBN` resuelva y aborta si no, para no filmar un error.
- Las cuentas demo comparten una contraseña conocida y viven en el clúster del
  colegio de prueba. Si eso molesta, cambiá `PASSWORD` en `seed-demo.mjs` y
  pasá `DEMO_PASSWORD` al grabar.

## Variables

| Variable | Default |
| --- | --- |
| `DEMO_BASE_URL` | `http://localhost:3100` |
| `DEMO_EMAIL` | `demo.gomez@coleswap.test` |
| `DEMO_PASSWORD` | `ColeSwapDemo2026!` |
| `DEMO_ISBN` | `9788420471839` |
| `DEMO_OUT` | `./demo-out` |
