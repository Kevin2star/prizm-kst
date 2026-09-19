import { supabase } from './api'

export function connectSpaceRealtime(spaceId, onEvent) {
  let active = true
  let pollTimer = null
  let channel = null
  let subscribed = false

  const startPolling = () => {
    if (pollTimer || !active) return
    pollTimer = setInterval(() => {
      onEvent({ type: 'POLL' })
    }, 3000)
  }

  const emit = (payload) => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    onEvent(payload)
  }

  if (!supabase) {
    startPolling()
    return () => {
      active = false
      if (pollTimer) clearInterval(pollTimer)
    }
  }

  try {
    const filter = `space_id=eq.${spaceId}`
    channel = supabase
      .channel(`space-${spaceId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artifacts', filter }, (payload) => {
        emit({ type: 'ARTIFACT_ADDED', artifact: payload.new })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'artifacts', filter }, (payload) => {
        emit({ type: 'ARTIFACT_UPDATED', artifact: payload.new })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'members', filter }, (payload) => {
        emit({
          type: 'MEMBER_JOINED',
          member: payload.new,
          nickname: payload.new?.nickname,
        })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'space_messages', filter }, (payload) => {
        emit({
          type: 'MESSAGE_ADDED',
          message: payload.new,
        })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          subscribed = true
          if (pollTimer) {
            clearInterval(pollTimer)
            pollTimer = null
          }
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          subscribed = false
          startPolling()
        }
      })

    setTimeout(() => {
      if (active && !subscribed) startPolling()
    }, 2500)
  } catch {
    startPolling()
  }

  return () => {
    active = false
    if (pollTimer) clearInterval(pollTimer)
    if (channel) supabase.removeChannel(channel)
  }
}
