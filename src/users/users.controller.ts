import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SignUpUser } from './dto/user.dto';
import { Permissions } from 'src/auth/permissions/permissions.decorator';
import { Permission } from 'src/auth/permissions/permission.enum';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Profile } from './entities/profile.entity';
import { CurrentUser, Public } from 'src/auth/decorators/public.decorator';
import { ApiAuthExceptionResponses } from 'src/common/decorators/code-responses.decorator';

@Controller('users')
@ApiAuthExceptionResponses()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Permissions(Permission.ManageUsers_RW)
  @HttpCode(HttpStatus.OK)
  @Post('signUp')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuario registrado correctamente',
  })
  signUp(@Body() signUpDto: SignUpUser) {
    return this.usersService.signUpUser(
      signUpDto.firstName,
      signUpDto.lastName,
      signUpDto.email,
      signUpDto.password,
      signUpDto.roleId,
    );
  }

  @Get('profile')
  @Public()
  @ApiOperation({ summary: 'Obtener perfil del usuario' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil del usuario',
    type: Profile,
  })
  getProfile(@CurrentUser() user) {
    return user || null;
  }
}
