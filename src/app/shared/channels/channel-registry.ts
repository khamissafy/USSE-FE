import { InjectionToken } from '@angular/core'

/**
 * Channel registry for multi-channel messaging (WBS, Telegram, SMPP, Evolution).
 *
 * Consumers (Chats, Messages, Campaigns, Bots) can inject:
 * `@Inject(CHANNEL_REGISTRY) channels: ChannelDescriptor[]`
 * to enumerate supported channels generically without hard-coding device types.
 *
 * **Campaigns (T059):** Campaign flows (`autoReply`, `subscribeToList`, `sendAndWait`,
 * `cancel`, `enqueryForm`) accept EVO devices through the same `deviceId` selector the
 * existing campaign UI uses; the backend routes outbound/inbound by device record. No
 * campaign-folder changes are required when EVO is registered here with
 * `supportsCampaigns: true`.
 *
 * **Bots (T060):** Bot trigger criteria (`start`, `end`, `contain`, `full`) apply to
 * inbound EVO messages because the backend `IncomingMessageHandler` is channel-agnostic
 * (FR-034); registering EVO with `supportsBots: true` documents that binding for the UI.
 */
export type ChannelKey = 'WBS' | 'TL' | 'SMPP' | 'EVO'

export interface ChannelDescriptor {
  key: ChannelKey
  displayName: string
  supportsChats: boolean
  supportsCampaigns: boolean
  supportsBots: boolean
  iconClass?: string
}

const EVOLUTION_CHANNEL_DESCRIPTOR: ChannelDescriptor = {
  key: 'EVO',
  displayName: 'Evolution (WhatsApp)',
  supportsChats: true,
  supportsCampaigns: true,
  supportsBots: true
}

/**
 * Root-provided channel list so any `providedIn: 'root'` consumer can resolve EVO without
 * importing the lazy `EvolutionDeviceModule`. Additional channels may append via future
 * `providedIn: 'root'` tokens or by extending this factory when other channel packs ship.
 */
export const CHANNEL_REGISTRY = new InjectionToken<ChannelDescriptor[]>('CHANNEL_REGISTRY', {
  providedIn: 'root',
  factory: (): ChannelDescriptor[] => [EVOLUTION_CHANNEL_DESCRIPTOR]
})

export function getChannelsForChats(registry: ChannelDescriptor[]): ChannelDescriptor[] {
  return registry.filter((c) => c.supportsChats)
}

export function getChannelsForCampaigns(registry: ChannelDescriptor[]): ChannelDescriptor[] {
  return registry.filter((c) => c.supportsCampaigns)
}

export function getChannelsForBots(registry: ChannelDescriptor[]): ChannelDescriptor[] {
  return registry.filter((c) => c.supportsBots)
}
