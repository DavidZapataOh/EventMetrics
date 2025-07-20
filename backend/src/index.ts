import os from 'os'
import server from './server'
import 'dotenv/config'

// 1) Define explícitamente host y puerto
const HOST = process.env.HOST || '127.0.0.1'
const PORT = Number(process.env.PORT) || 5000

// 2) Arranca el servidor indicando HOST y PORT
const srv = server.listen(PORT, HOST, () => {
  // 3) Extrae la info real de dónde está escuchando
  const addr = srv.address()
  // Cuando addr es objeto, tiene { address, port }
  const host = typeof addr === 'object'
    ? addr.address
    : HOST            // en caso de socket o pipe, usa HOST por defecto

  const port = typeof addr === 'object'
    ? addr.port
    : PORT            // idem

  console.log(`> Server is running at http://${host}:${port}`)
  console.log(`> NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
  console.log(`> OS Hostname: ${os.hostname()}`)
})
