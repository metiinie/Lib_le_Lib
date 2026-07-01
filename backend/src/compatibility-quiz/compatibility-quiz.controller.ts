import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CompatibilityQuizService } from './compatibility-quiz.service';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('compatibility-quiz')
@ApiBearerAuth()
@Controller('compatibility-quiz')
@UseGuards(JwtAuthGuard)
export class CompatibilityQuizController {
  constructor(private readonly quizService: CompatibilityQuizService) {}

  @Get('questions')
  async getQuestions() {
    return this.quizService.getQuestions();
  }

  @Post('responses')
  async submitResponse(
    @CurrentUser() user: any,
    @Body() dto: SubmitResponseDto,
  ) {
    return this.quizService.submitResponse(user.id, dto);
  }
}
