import express, { Express, Request, Response } from 'express'

const app: Express = express()

const ENV = process.env.ENV || "dev"
process.loadEnvFile(`.${ENV}.env`)

const PORT = process.env.PORT
console.log(PORT)

app.get("/_internal_/healthcheck", (_: Request, res: Response) => {
	res.send({status: 'healthy'})
})

app.listen(PORT, () => console.log(`Server started on localhost:${PORT}`))
