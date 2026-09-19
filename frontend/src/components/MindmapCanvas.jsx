import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import * as d3 from 'd3'
import { colorForMajor } from './MindmapTree'

const DEFAULT_COLOR = '#555555'

function wrapLines(text, maxChars = 16, maxLines = 2) {
  const value = String(text || '').replace(/\s+/g, ' ').trim()
  if (!value) return ['']
  const lines = []
  let rest = value
  while (rest && lines.length < maxLines) {
    if (rest.length <= maxChars) {
      lines.push(rest)
      rest = ''
      break
    }
    lines.push(rest.slice(0, maxChars))
    rest = rest.slice(maxChars)
  }
  if (rest && lines.length) {
    const last = lines[lines.length - 1]
    lines[lines.length - 1] = `${last.slice(0, Math.max(1, maxChars - 1))}…`
  }
  return lines
}

function statusSuffix(node) {
  if (node.status === 'PENDING' || node.status === 'PROCESSING') return ' · 분석 중'
  if (node.status === 'FAILED') return ' · 실패'
  if (node.updated) return ' · 업데이트됨'
  return ''
}

function canExpand(node) {
  return Boolean(
    node.body ||
      (node.items && node.items.length) ||
      (node.children && node.children.length) ||
      node.type === 'COMMON' ||
      node.type === 'DIFF' ||
      node.type === 'NOTES' ||
      node.type === 'GROUP' ||
      node.type === 'SOURCES' ||
      node.type === 'SPACE',
  )
}

function graphToChart(node, expanded) {
  if (!node) return null
  const open = node.type === 'SPACE' || expanded.has(node.id)
  const kids = []

  if (open && node.body) {
    kids.push({
      id: `${node.id}::body`,
      name: String(node.body || '').replace(/\s+/g, ' ').trim(),
      type: 'BODY',
      color: DEFAULT_COLOR,
      sourceArtifactIds: node.sourceArtifactIds,
      expandable: false,
    })
  }

  if (open) {
    ;(node.items || []).forEach((item, index) => {
      kids.push({
        id: `${node.id}::item-${item.artifactId ?? index}`,
        name: String(item.summary || '').replace(/\s+/g, ' ').trim(),
        type: 'ITEM',
        color: colorForMajor(item.nickname),
        artifactId: item.artifactId,
        nickname: item.nickname,
        expandable: false,
      })
    })
    ;(node.children || []).forEach((child) => {
      kids.push(graphToChart(child, expanded))
    })
    if (node.sourceArtifactIds?.length && ['COMMON', 'DIFF', 'NOTES'].includes(node.type)) {
      kids.push({
        id: `${node.id}::sources`,
        name: `소스 ${node.sourceArtifactIds.length}개 보기`,
        type: 'SOURCE_LINK',
        color: '#60a5fa',
        sourceArtifactIds: node.sourceArtifactIds,
        expandable: false,
      })
    }
  }

  return {
    id: node.id,
    name: `${node.label || ''}${statusSuffix(node)}`,
    type: node.type,
    color: node.nickname
      ? colorForMajor(node.nickname)
      : node.status === 'FAILED'
        ? '#ef4444'
        : node.status === 'PENDING' || node.status === 'PROCESSING'
          ? '#f59e0b'
          : node.updated
            ? '#60a5fa'
            : DEFAULT_COLOR,
    artifactId: node.artifactId,
    sourceArtifactIds: node.sourceArtifactIds,
    expandable: canExpand(node),
    children: open && kids.length ? kids : undefined,
  }
}

function handleNodeClick(d, handlers) {
  const node = d.data
  if (node.type === 'ARTIFACT' && node.artifactId) {
    handlers.onOpenArtifact(node.artifactId)
    return
  }
  if (node.type === 'ITEM' && node.artifactId) {
    handlers.onOpenArtifact(node.artifactId)
    return
  }
  if (node.type === 'SOURCE_LINK' && node.sourceArtifactIds?.length) {
    handlers.onOpenSources(node.sourceArtifactIds)
    return
  }
  if (node.type === 'BODY' && node.sourceArtifactIds?.length) {
    handlers.onOpenSources(node.sourceArtifactIds)
    return
  }
  if (node.expandable && node.id) handlers.onToggle(node.id)
}

function drawTree(g, data, handlers) {
  const root = d3.hierarchy(data)
  d3.tree().nodeSize([96, 320])(root)
  const nodes = root.descendants()
  const links = root.links()

  const linkSelection = g.selectAll('.link').data(links, (d) => d.target.data.id)
  linkSelection
    .enter()
    .insert('path', 'g')
    .attr('class', 'link')
    .merge(linkSelection)
    .attr('d', d3.linkHorizontal().x((d) => d.y).y((d) => d.x))
    .style('stroke', (d) => d.target.data.color || DEFAULT_COLOR)
  linkSelection.exit().remove()

  const nodeSelection = g.selectAll('.node').data(nodes, (d) => d.data.id)
  const nodeEnter = nodeSelection
    .enter()
    .append('g')
    .attr('class', 'node')
    .on('click', (event, d) => {
      event.stopPropagation()
      handleNodeClick(d, handlers)
    })

  nodeEnter.append('rect').attr('rx', 6).attr('ry', 6)
  nodeEnter.append('text')

  const nodeUpdate = nodeEnter.merge(nodeSelection)
  nodeUpdate.attr('transform', (d) => `translate(${d.y},${d.x})`)

  nodeUpdate.each(function applyLabel(d) {
    const lines = wrapLines(d.data.name)
    const lineHeight = 18
    const rectHeight = Math.max(36, 14 + lines.length * lineHeight)
    const group = d3.select(this)
    const text = group.select('text')
    text.selectAll('tspan').remove()
    text.attr('text-anchor', 'start').attr('x', 12).attr('y', 0)
    const startDy = -((lines.length - 1) * lineHeight) / 2
    lines.forEach((line, index) => {
      text
        .append('tspan')
        .attr('x', 12)
        .attr('dy', index === 0 ? startDy + 4 : lineHeight)
        .text(line)
    })
    let textWidth = 40
    text.selectAll('tspan').each(function measure() {
      textWidth = Math.max(textWidth, this.getComputedTextLength())
    })
    const rectWidth = Math.max(textWidth + 24, 40)
    group
      .select('rect')
      .attr('width', rectWidth)
      .attr('height', rectHeight)
      .attr('x', 0)
      .attr('y', -rectHeight / 2)
      .style('stroke', d.data.color || DEFAULT_COLOR)
  })

  nodeSelection.exit().remove()
}

const MindmapCanvas = forwardRef(function MindmapCanvas(
  { root, expanded, onToggle, onOpenArtifact, onOpenSources, onError },
  ref,
) {
  const wrapRef = useRef(null)
  const svgRef = useRef(null)
  const gRef = useRef(null)
  const zoomRef = useRef(null)
  const handlersRef = useRef({ onToggle, onOpenArtifact, onOpenSources })

  const data = useMemo(() => graphToChart(root, expanded), [root, expanded])

  useEffect(() => {
    handlersRef.current = { onToggle, onOpenArtifact, onOpenSources }
  }, [onToggle, onOpenArtifact, onOpenSources])

  useImperativeHandle(ref, () => ({
    zoomIn() {
      const ctx = zoomRef.current
      if (!ctx) return
      ctx.svg.transition().duration(300).call(ctx.zoom.scaleBy, 1.3)
    },
    zoomOut() {
      const ctx = zoomRef.current
      if (!ctx) return
      ctx.svg.transition().duration(300).call(ctx.zoom.scaleBy, 0.7)
    },
    fit() {
      const ctx = zoomRef.current
      if (!ctx) return
      const { width, height, svg, zoom } = ctx
      const next = d3.zoomIdentity.translate(width / 6, height / 2.5).scale(1)
      svg.transition().duration(400).call(zoom.transform, next)
    },
  }))

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined

    let width = el.clientWidth || 800
    let height = el.clientHeight || 560
    const svg = d3
      .select(el)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
    const g = svg.append('g').attr('class', 'plot')
    const zoom = d3.zoom().scaleExtent([0.1, 4]).on('zoom', (event) => {
      g.attr('transform', event.transform)
    })
    svg.call(zoom)
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 6, height / 2.5).scale(1))

    svgRef.current = svg
    gRef.current = g
    zoomRef.current = { svg, zoom, width, height }

    const observer = new ResizeObserver((entries) => {
      window.requestAnimationFrame(() => {
        for (const entry of entries) {
          width = entry.contentRect.width
          height = entry.contentRect.height
          svg.attr('viewBox', `0 0 ${width} ${height}`)
          if (zoomRef.current) zoomRef.current = { ...zoomRef.current, width, height }
        }
      })
    })
    observer.observe(el)

    return () => {
      observer.disconnect()
      svg.remove()
      svgRef.current = null
      gRef.current = null
      zoomRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!gRef.current || !data) return
    try {
      drawTree(gRef.current, data, handlersRef.current)
    } catch (err) {
      onError?.(err)
    }
  }, [data, onError])

  return <div className="nlm-canvas-wrap" ref={wrapRef} />
})

export default MindmapCanvas
