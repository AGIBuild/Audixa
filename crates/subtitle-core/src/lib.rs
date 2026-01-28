use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SubtitleItem {
  pub id: String,
  pub time: String,
  pub en: String,
  pub cn: String,
  pub start_ms: i64,
  pub end_ms: i64,
}

pub fn parse_subtitle_content(format: &str, content: &str) -> Vec<SubtitleItem> {
  match format {
    "srt" => parse_srt(content),
    "vtt" => parse_vtt(content),
    "ass" => parse_ass(content),
    _ => Vec::new(),
  }
}

fn parse_srt(content: &str) -> Vec<SubtitleItem> {
  let cleaned = content.replace('\r', "");
  let blocks = split_blocks(&cleaned);
  let mut items = Vec::new();
  for (index, block) in blocks.iter().enumerate() {
    let lines: Vec<&str> = block
      .lines()
      .map(|line| line.trim())
      .filter(|line| !line.is_empty())
      .collect();
    if lines.len() < 2 {
      continue;
    }
    let time_line = if lines[0].contains("-->") {
      lines[0]
    } else {
      lines.get(1).copied().unwrap_or_default()
    };
    let mut parts = time_line.split("-->");
    let start_raw = parts.next().unwrap_or_default().trim();
    let end_raw = parts.next().unwrap_or_default().trim();
    let (start_ms, end_ms) = match (parse_timecode(start_raw), parse_timecode(end_raw)) {
      (Some(start_ms), Some(end_ms)) => (start_ms, end_ms),
      _ => continue,
    };
    let text_start = if lines[0].contains("-->") { 1 } else { 2 };
    let text_lines = lines
      .iter()
      .skip(text_start)
      .map(|line| line.to_string())
      .collect::<Vec<_>>();
    items.push(build_item(index, start_ms, end_ms, &text_lines));
  }
  items
}

fn parse_vtt(content: &str) -> Vec<SubtitleItem> {
  let mut cleaned = content.replace('\r', "");
  let trimmed = cleaned.trim_start();
  if trimmed.to_uppercase().starts_with("WEBVTT") {
    if let Some(pos) = cleaned.find('\n') {
      cleaned = cleaned[(pos + 1)..].to_string();
    } else {
      cleaned.clear();
    }
  }
  let blocks = split_blocks(&cleaned);
  let mut items = Vec::new();
  for (index, block) in blocks.iter().enumerate() {
    let lines: Vec<&str> = block
      .lines()
      .map(|line| line.trim())
      .filter(|line| !line.is_empty())
      .collect();
    if lines.len() < 2 {
      continue;
    }
    let time_line = if lines[0].contains("-->") {
      lines[0]
    } else {
      lines.get(1).copied().unwrap_or_default()
    };
    let mut parts = time_line.split("-->");
    let start_raw = parts.next().unwrap_or_default().trim();
    let end_raw = parts.next().unwrap_or_default().trim();
    let (start_ms, end_ms) = match (parse_timecode(start_raw), parse_timecode(end_raw)) {
      (Some(start_ms), Some(end_ms)) => (start_ms, end_ms),
      _ => continue,
    };
    let text_start = if lines[0].contains("-->") { 1 } else { 2 };
    let text_lines = lines
      .iter()
      .skip(text_start)
      .map(|line| line.to_string())
      .collect::<Vec<_>>();
    items.push(build_item(index, start_ms, end_ms, &text_lines));
  }
  items
}

fn parse_ass(content: &str) -> Vec<SubtitleItem> {
  let cleaned = content.replace('\r', "");
  let mut items = Vec::new();
  let mut index = 0;
  for line in cleaned.lines() {
    let line = line.trim_start();
    if !line.starts_with("Dialogue:") {
      continue;
    }
    let parts: Vec<&str> = line.split(',').collect();
    if parts.len() < 10 {
      continue;
    }
    let start_raw = parts[1].trim();
    let end_raw = parts[2].trim();
    let text = parts[9..]
      .join(",")
      .replace("\\N", "\n")
      .replace("\\n", "\n")
      .replace("\\h", " ");
    let (start_ms, end_ms) = match (parse_ass_timecode(start_raw), parse_ass_timecode(end_raw)) {
      (Some(start_ms), Some(end_ms)) => (start_ms, end_ms),
      _ => continue,
    };
    let text_lines = text
      .lines()
      .map(strip_ass_tags)
      .map(|line| line.trim().to_string())
      .collect::<Vec<_>>();
    items.push(build_item(index, start_ms, end_ms, &text_lines));
    index += 1;
  }
  items
}

fn build_item(index: usize, start_ms: i64, end_ms: i64, lines: &[String]) -> SubtitleItem {
  let (en, cn) = normalize_lines(lines);
  SubtitleItem {
    id: format!("sub-{}-{}", index, start_ms),
    time: format_timestamp(start_ms),
    en,
    cn,
    start_ms,
    end_ms,
  }
}

fn normalize_lines(lines: &[String]) -> (String, String) {
  let trimmed: Vec<String> = lines
    .iter()
    .map(|line| line.trim())
    .filter(|line| !line.is_empty())
    .map(String::from)
    .collect();
  if trimmed.is_empty() {
    return (String::new(), String::new());
  }
  if trimmed.len() == 1 {
    return (trimmed[0].clone(), String::new());
  }
  (trimmed[0].clone(), trimmed[1].clone())
}

fn parse_timecode(value: &str) -> Option<i64> {
  let value = value.trim();
  let (time_part, fraction_part) = value
    .split_once(',')
    .or_else(|| value.split_once('.'))?;
  let segments: Vec<&str> = time_part.split(':').collect();
  let (hours, minutes, seconds) = match segments.len() {
    3 => (
      segments[0].parse::<i64>().ok()?,
      segments[1].parse::<i64>().ok()?,
      segments[2].parse::<i64>().ok()?,
    ),
    2 => (
      0,
      segments[0].parse::<i64>().ok()?,
      segments[1].parse::<i64>().ok()?,
    ),
    _ => return None,
  };
  let millis = parse_fraction_to_ms(fraction_part)?;
  Some(hours * 3_600_000 + minutes * 60_000 + seconds * 1_000 + millis)
}

fn parse_ass_timecode(value: &str) -> Option<i64> {
  let value = value.trim();
  let (time_part, fraction_part) = value.split_once('.')?;
  let segments: Vec<&str> = time_part.split(':').collect();
  if segments.len() != 3 {
    return None;
  }
  let hours = segments[0].parse::<i64>().ok()?;
  let minutes = segments[1].parse::<i64>().ok()?;
  let seconds = segments[2].parse::<i64>().ok()?;
  let centis = parse_fraction_to_ms(fraction_part)?;
  Some(hours * 3_600_000 + minutes * 60_000 + seconds * 1_000 + centis)
}

fn parse_fraction_to_ms(value: &str) -> Option<i64> {
  let mut digits: String = value.chars().filter(|c| c.is_ascii_digit()).collect();
  if digits.is_empty() {
    return None;
  }
  if digits.len() > 3 {
    digits.truncate(3);
  }
  while digits.len() < 3 {
    digits.push('0');
  }
  digits.parse::<i64>().ok()
}

fn format_timestamp(ms: i64) -> String {
  let total_seconds = ms / 1000;
  let minutes = total_seconds / 60;
  let seconds = total_seconds % 60;
  format!("{:02}:{:02}", minutes, seconds)
}

fn split_blocks(content: &str) -> Vec<String> {
  let mut blocks = Vec::new();
  let mut current: Vec<String> = Vec::new();
  for line in content.lines() {
    if line.trim().is_empty() {
      if !current.is_empty() {
        blocks.push(current.join("\n"));
        current.clear();
      }
      continue;
    }
    current.push(line.to_string());
  }
  if !current.is_empty() {
    blocks.push(current.join("\n"));
  }
  blocks
}

fn strip_ass_tags(value: &str) -> String {
  let mut output = String::with_capacity(value.len());
  let mut in_tag = false;
  for ch in value.chars() {
    if ch == '{' {
      in_tag = true;
      continue;
    }
    if ch == '}' {
      in_tag = false;
      continue;
    }
    if !in_tag {
      output.push(ch);
    }
  }
  output
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn parses_srt_blocks() {
    let content = "1\n00:00:01,000 --> 00:00:03,000\nHello\n你好\n\n2\n00:00:04,000 --> 00:00:05,000\nWorld\n";
    let items = parse_subtitle_content("srt", content);
    assert_eq!(items.len(), 2);
    assert_eq!(items[0].en, "Hello");
    assert_eq!(items[0].cn, "你好");
    assert_eq!(items[0].start_ms, 1000);
    assert_eq!(items[0].end_ms, 3000);
  }

  #[test]
  fn parses_vtt_blocks() {
    let content = "WEBVTT\n\n00:01.500 --> 00:02.500\nHello VTT\n";
    let items = parse_subtitle_content("vtt", content);
    assert_eq!(items.len(), 1);
    assert_eq!(items[0].en, "Hello VTT");
    assert_eq!(items[0].start_ms, 1500);
    assert_eq!(items[0].end_ms, 2500);
  }

  #[test]
  fn parses_ass_dialogue_lines() {
    let content = "[Script Info]\nTitle: Sample\n\n[Events]\nDialogue: 0,0:00:01.00,0:00:02.50,Default,,0,0,0,,{\\fnArial\\fs20}Hello{\\r}\\N{\\fs12}你好{\\r}\n";
    let items = parse_subtitle_content("ass", content);
    assert_eq!(items.len(), 1);
    assert_eq!(items[0].en, "Hello");
    assert_eq!(items[0].cn, "你好");
    assert_eq!(items[0].start_ms, 1000);
    assert_eq!(items[0].end_ms, 2500);
  }

  #[test]
  fn parses_mm_ss_timecodes() {
    let content = "1\n00:01,250 --> 00:02,500\nShort time\n";
    let items = parse_subtitle_content("srt", content);
    assert_eq!(items.len(), 1);
    assert_eq!(items[0].start_ms, 1250);
    assert_eq!(items[0].end_ms, 2500);
  }
}
