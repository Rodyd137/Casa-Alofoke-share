# Casa Alofoke — One Tab (Vite + React) con estado compartido

Muestra:
- Video en vivo primero
- Contador de espectadores (livecounts.io) y visitas (CountAPI)
- Tabla de posiciones con %
- Panel de Ajustes con autenticación local
- **Estado compartido para todos los visitantes** (Cloudflare KV)

## 🚀 Local
```bash
npm i
npm run dev
```

## 🏗️ Build
```bash
npm run build
# salida en dist/
```

## 🌐 Cloudflare Pages
1. Sube el repo a GitHub.
2. En Pages: **Create project → Connect to Git**.
3. **Build command:** `npm run build`
4. **Output directory:** `dist`

### Configurar estado compartido (obligatorio para que todos vean lo mismo)
1. En tu proyecto de Pages ve a **Settings → Functions → KV bindings → Add binding**  
   - **Binding name:** `ALOFOKE_KV`  
   - **Namespace:** crea una nueva, p.e. `alofoke_state`
2. En **Settings → Environment variables** agrega:  
   - `ADMIN_TOKEN` (elige un valor; por simplicidad puedes usar `PrinceMatias1`)
3. Re-despliega el proyecto.

- El front hace `GET /api/state` al cargar.
- Al guardar en **Ajustes**, el front hace `POST /api/state` con el header `x-admin`.

> Nota: El token va en el cliente (no es 100% seguro). Si quieres, luego lo movemos a un panel protegido por un Worker con sesión.

## 🔑 Credenciales (por defecto)
- Usuario: `Alofoke`
- Contraseña: `PrinceMatias1`
