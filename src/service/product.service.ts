import { Repository } from 'typeorm';
import { CreateProductDTO, UpdateProductDTO } from '../dtos/product.dto';
import { Product } from '../entities/product.entity';
import { Subcategory } from '../entities/subcategory.entity';
import { User, UserRole } from '../entities/user.entity';
import AppDataSource from '../config/db.config';
import { v2 as cloudinary } from 'cloudinary';

export class ProductService {
    private productRepository: Repository<Product>;
    private subcategoryRepository: Repository<Subcategory>;
    private userRepository: Repository<User>;

    constructor() {
        this.productRepository = AppDataSource.getRepository(Product);
        this.subcategoryRepository = AppDataSource.getRepository(Subcategory);
        this.userRepository = AppDataSource.getRepository(User);

        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }



    async createProduct(dto: CreateProductDTO, subcategoryId: number, userId: number, files: Express.Multer.File[]): Promise<Product> {
        const subcategory = await this.subcategoryRepository.findOne({ where: { id: subcategoryId } });
        if (!subcategory) {
            throw new Error('Subcategory not found');
        }

        const user = await this.userRepository.findOne({ where: { id: userId, role: UserRole.VENDOR } });
        if (!user) {
            throw new Error('User not found or not a vendor');
        }

        let imageUrls: string[] = [];
        if (files && files.length > 0) {
            const uploadPromises = files.map(file =>
                new Promise<string>((resolve, reject) => {
                    cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
                        if (error || !result) reject(new Error('Image upload failed'));
                        else resolve(result.secure_url);
                    }).end(file.buffer);
                })
            );
            imageUrls = await Promise.all(uploadPromises);
        }

        const product = this.productRepository.create({
            ...dto,
            subcategory,
            vendor: user,
            image_urls: imageUrls,
        });
        return this.productRepository.save(product);
    }





    async getProducts(subcategoryId: number): Promise<Product[]> {
        return this.productRepository.find({
            where: { subcategory: { id: subcategoryId } },
            relations: ['subcategory', 'vendor'],
        });
    }





    async getProductById(id: number, subcategoryId: number): Promise<Product | null> {
        return this.productRepository.findOne({
            where: { id, subcategory: { id: subcategoryId } },
            relations: ['subcategory', 'vendor'],
        });
    }




    async updateProduct(id: number, dto: UpdateProductDTO, subcategoryId: number, userId: number, files: Express.Multer.File[]): Promise<Product | null> {
        const user = await this.userRepository.findOne({ where: { id: userId, role: UserRole.VENDOR } });
        if (!user) {
            throw new Error('User not found or not a vendor');
        }

        const product = await this.productRepository.findOne({
            where: { id, subcategory: { id: subcategoryId } },
        });
        if (!product) {
            throw new Error('Product not found');
        }

        let imageUrls = product.image_urls;
        if (files && files.length > 0) {
            const uploadPromises = files.map(file =>
                new Promise<string>((resolve, reject) => {
                    cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
                        if (error || !result) reject(new Error('Image upload failed'));
                        else resolve(result.secure_url);
                    }).end(file.buffer);
                })
            );
            const newImageUrls = await Promise.all(uploadPromises);
            imageUrls = [...imageUrls, ...newImageUrls];
        }

        await this.productRepository.update(id, { ...dto, image_urls: imageUrls });
        return this.productRepository.findOne({
            where: { id, subcategory: { id: subcategoryId } },
            relations: ['subcategory', 'vendor'],
        });
    }






    async deleteProduct(id: number, subcategoryId: number, userId: number): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        const product = await this.productRepository.findOne({
            where: { id, subcategory: { id: subcategoryId } },
        });
        if (!product) {
            throw new Error('Product not found');
        }

        if (user.role !== UserRole.ADMIN && product.vendor.id !== userId) {
            throw new Error('You can only delete your own products');
        }

        if (product.image_urls.length > 0) {
            const publicIds = product.image_urls.map(url => url.split('/').pop()?.split('.')[0] || '');
            await Promise.all(publicIds.map(id => cloudinary.uploader.destroy(id)));
        }

        await this.productRepository.delete(id);
    }





    async deleteProductImage(id: number, subcategoryId: number, userId: number, imageUrl: string): Promise<Product | null> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        const product = await this.productRepository.findOne({
            where: { id, subcategory: { id: subcategoryId } },
        });
        if (!product) {
            throw new Error('Product not found');
        }

        if (user.role !== UserRole.ADMIN && product.vendor.id !== userId) {
            throw new Error('You can only delete images from your own products');
        }

        const imageIndex = product.image_urls.indexOf(imageUrl);
        if (imageIndex === -1) {
            throw new Error('Image not found');
        }

        // Remove image from Cloudinary
        const publicId = imageUrl.split('/').pop()?.split('.')[0] || '';
        await cloudinary.uploader.destroy(publicId);

        // Update image_urls by removing the specified image
        product.image_urls.splice(imageIndex, 1);
        await this.productRepository.update(id, { image_urls: product.image_urls });

        return this.productRepository.findOne({
            where: { id, subcategory: { id: subcategoryId } },
            relations: ['subcategory', 'vendor'],
        });
    }

    
}