import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SsoAuthDto {
    @ApiProperty({ description: 'OAuth ID token issued by Apple or Google SDK', example: 'eyJhbGciOiJSUzI1NiIs...' })
    @IsString()
    @IsNotEmpty()
    idToken: string;

    @ApiProperty({ description: 'User email provided by provider', example: 'user@example.com', required: false })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ description: 'User full name provided by provider during initial sign-in', example: 'Alex Morgan', required: false })
    @IsString()
    @IsOptional()
    fullName?: string;
}
