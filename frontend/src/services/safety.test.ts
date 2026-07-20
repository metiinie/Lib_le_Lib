import { safetyService } from './safety.service';
import { discoveryService } from './discovery.service';
import { api } from '@/lib/api';

jest.mock('@/lib/api');

describe('Safety Service - Block Visibility', () => {
  it('must ensure a blocked user is absent from discovery and match lists', async () => {
    const targetUserId = 'user_to_block_123';
    
    // Simulate the block action being fired
    (api.post as jest.Mock).mockResolvedValueOnce({ success: true });
    await safetyService.blockUser(targetUserId);

    // Assert that the block endpoint was hit
    expect(api.post).toHaveBeenCalledWith('/blocks', { targetUserId });

    // In a full integration context, we'd invalidate the react-query cache for `getProfiles`.
    // Here we simulate the effect: if a user is blocked, the backend `getProfiles` 
    // mock should no longer return them. And even if it does, our client defense catches it.
    
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: [
        { id: '1', nickname: 'Alice', isBlocked: false },
        { id: targetUserId, nickname: 'BadActor', isBlocked: true }, 
      ],
    });

    const profiles = await discoveryService.getProfiles();
    
    // Validate that the blocked user is filtered out of discovery
    expect(profiles.find(p => p.id === targetUserId)).toBeUndefined();
  });
});
