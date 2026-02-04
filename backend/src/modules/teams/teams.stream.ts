import { Response } from 'express';

const HEARTBEAT_MS = 25000;

type StreamClient = {
  res: Response;
  heartbeat: NodeJS.Timeout;
};

const streams = new Map<string, Set<StreamClient>>();

function send(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function registerTeamStream(teamId: string, res: Response) {
  if (!streams.has(teamId)) {
    streams.set(teamId, new Set());
  }
  const client: StreamClient = {
    res,
    heartbeat: setInterval(() => {
      try {
        send(res, 'heartbeat', { ts: Date.now() });
      } catch (error) {
        console.error('Erro ao enviar heartbeat SSE', error);
      }
    }, HEARTBEAT_MS),
  };
  streams.get(teamId)!.add(client);
  return client;
}

export function unregisterTeamStream(teamId: string, client: StreamClient) {
  clearInterval(client.heartbeat);
  const set = streams.get(teamId);
  if (!set) return;
  set.delete(client);
  if (!set.size) {
    streams.delete(teamId);
  }
}

export function sendInitialMessages(res: Response, messages: unknown[]) {
  send(res, 'init', { messages });
}

export function broadcastTeamMessage(teamId: string, payload: unknown) {
  const set = streams.get(teamId);
  if (!set?.size) {
    return;
  }
  for (const client of set) {
    send(client.res, 'message', payload);
  }
}

export type TeamStreamClient = StreamClient;
