// import { IsEmail, IsNotEmpty, MinLength, IsString, IsOptional, IsEnum } from 'class-validator';
// import { UserRole } from '../entities/user.entity';

// export class SignupDTO {
//     @IsNotEmpty({ message: 'Username is required' })
//     @IsString()
//     username: string;

//     @IsEmail({}, { message: 'Invalid email format' })
//     email: string;

//     @IsNotEmpty({ message: 'Password is required' })
//     @MinLength(8, { message: 'Password must be at least 8 characters long' })
//     password: string;

//     @IsOptional()
//     @IsEnum(UserRole, { message: 'Invalid role' })
//     role?: UserRole; // Optional role

// }

// export class LoginDTO {
//     @IsEmail({}, { message: 'Invalid email format' })
//     email: string;

//     @IsNotEmpty({ message: 'Password is required' })
//     password: string;
// }

// export class VerificationTokenDTO {
//     @IsEmail({}, { message: 'Invalid email format' })
//     email: string;
// }

// export class VerifyTokenDTO {
//     @IsEmail({}, { message: 'Invalid email format' })
//     email: string;

//     @IsNotEmpty({ message: 'Token is required' })
//     @IsString()
//     token: string;
// }

// export class ResetPasswordDTO {
//     @IsNotEmpty({ message: 'New password is required' })
//     @MinLength(8, { message: 'New password must be at least 8 characters long' })
//     newPass: string;

//     @IsNotEmpty({ message: 'Confirm password is required' })
//     confirmPass: string;

//     @IsNotEmpty({ message: 'Token is required' })
//     @IsString()
//     token: string;
// }

// export class ChangeEmailDTO {
//     @IsEmail({}, { message: 'Invalid email format' })
//     newEmail: string;
// }

// export class VerifyEmailChangeDTO {
//     @IsNotEmpty({ message: 'Token is required' })
//     @IsString()
//     token: string;

//     @IsNotEmpty({ message: 'Email change token is required' })
//     @IsString()
//     emailChangeToken: string;
// }