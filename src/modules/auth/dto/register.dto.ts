import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

export class RegisterDto {
  @ApiProperty({ example: "guru_ipa" })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: "guru.ipa@smppgri7bdg.sch.id" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "Rahasia#123" })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: "Siti Nurhaliza, S.Pd" })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: "198501012010012001" })
  @IsString()
  @IsOptional()
  nipNuptk?: string;

  @ApiPropertyOptional({ example: "081234567890" })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.GURU })
  @IsEnum(UserRole)
  role: UserRole;
}
