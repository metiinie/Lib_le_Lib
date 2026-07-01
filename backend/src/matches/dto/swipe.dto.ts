import { IsIn, IsUUID } from 'class-validator';

export const SWIPE_ACTIONS = ['like', 'pass'] as const;
export type SwipeActionType = (typeof SWIPE_ACTIONS)[number];

export class SwipeDto {
  @IsUUID()
  targetId: string;

  @IsIn(SWIPE_ACTIONS)
  action: SwipeActionType;
}
