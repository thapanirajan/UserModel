import { DataSource } from "typeorm"
import { config } from "dotenv"
import { User } from "../entities/user.entity"
import { Subcategory } from "../entities/subcategory.entity"
import { Category } from "../entities/category.entity"
import { Product } from "../entities/product.entity"
config()


// Initialize TypeORM DataSource for PostgreSQL database connection
const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [User, Category, Subcategory,Product],
    migrations: [],
    subscribers: [],
})

export default AppDataSource;