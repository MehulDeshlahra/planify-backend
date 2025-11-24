import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePlanDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsNotEmpty()
    location: string;

    // ISO datetime string or epoch string; validate further if you want
    @IsString()
    @IsNotEmpty()
    time: string;
}
