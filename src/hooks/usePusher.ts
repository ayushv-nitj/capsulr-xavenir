import { useEffect, useState } from 'react';
import type Pusher from 'pusher-js';

export const usePusher = (userEmail: string | null, callbacks: {
  onCapsuleCreated?: (data: any) => void;
  onCapsuleShared?: (data: any) => void;
  onCapsuleUnlocked?: (data: any) => void;
}) => {
  const [pusher, setPusher] = useState<Pusher | null>(null);

  // Initialize Pusher client-side only
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPusher = async () => {
      try {
        const PusherClient = (await import('pusher-js')).default;
        const pusherInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
          forceTLS: true,
        });

        setPusher(pusherInstance);
      } catch (error) {
        console.error('Failed to initialize Pusher:', error);
      }
    };

    initPusher();

    return () => {
      if (pusher) {
        pusher.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!userEmail || !pusher) return;

    const channelName = `user-${userEmail}`;
    const channel = pusher.subscribe(channelName);

    // Listen for capsule creation events
    if (callbacks.onCapsuleCreated) {
      channel.bind('capsule-created', callbacks.onCapsuleCreated);
    }

    // Listen for capsule sharing events (when added as collaborator/recipient)
    if (callbacks.onCapsuleShared) {
      channel.bind('capsule-shared', callbacks.onCapsuleShared);
    }

    // Listen for capsule unlock events
    if (callbacks.onCapsuleUnlocked) {
      channel.bind('capsule-unlocked', callbacks.onCapsuleUnlocked);
    }

    // Cleanup on unmount
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [userEmail, pusher, callbacks.onCapsuleCreated, callbacks.onCapsuleShared, callbacks.onCapsuleUnlocked]);
};