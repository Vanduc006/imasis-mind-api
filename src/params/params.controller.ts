import { Controller, Get, Param } from '@nestjs/common';

@Controller('params')

export class ParamsController {
    @Get(':id')
    getUserById(@Param('id') id: string): object {
        return { message: `Hello, user with ID: ${id}` }; // Trả về JSON chứa ID
    }
}
