import { IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "admin", description: "Username atau email terdaftar" })
  @IsString()
  @IsNotEmpty({ message: "Identifier (username/email) tidak boleh kosong" })
  identifier: string;

  @ApiProperty({ example: "Pgri7Bdg#2026!", description: "Password akun" })
  @IsString()
  @MinLength(6, { message: "Password minimal 6 karakter" })
  password: string;
}
