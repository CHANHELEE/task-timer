# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`my-study-timer` — 학습 시간을 측정하고 관리하는 타이머 앱.



## Architecture

-  Electron + React + SqlLite

### 핵심 도메인 개념

- **Session**: 하나의 학습 세션 (시작 시각, 종료 시각, 과목/태그, 세션당 목표 시간 설정)
- **Timer**: 현재 진행 중인 타이머 상태 (running / paused / idle)
- **Statistics**: 세션 집계 데이터 (일별·주별·과목별 통계)

