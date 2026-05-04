import React, { useState, useRef, useEffect } from 'react';
import './CourseDropdown.css';

export default function CourseDropdown({
  inputKey,
  value,
  onChange,
  disabled,
  availableCourses,
  isSelectedElsewhere,
  placeholder = 'Search courses...'
}) {
  const courseList = Object.keys(availableCourses || {});
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const [sticky, setSticky] = useState(null); // null | 'top' | 'bottom'
  const rootRef = useRef();
  const listRef = useRef();

  useEffect(() => {
    const onClose = (e) => {
      if (e.detail && e.detail !== inputKey) setOpen(false);
    };
    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('closeDropdowns', onClose);
    document.addEventListener('click', onDocClick);
    return () => {
      window.removeEventListener('closeDropdowns', onClose);
      document.removeEventListener('click', onDocClick);
    };
  }, [inputKey]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const items = el.querySelectorAll('.dropdown-item');
      const idx = highlighted;
      if (!items || items.length === 0) return setSticky(null);
      const item = items[idx];
      if (!item) return setSticky(null);
      const itemRect = item.getBoundingClientRect();
      const listRect = el.getBoundingClientRect();
      if (itemRect.top < listRect.top) {
        setSticky('top');
      } else if (itemRect.bottom > listRect.bottom) {
        setSticky('bottom');
      } else {
        setSticky(null);
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    // run once to initialize
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [highlighted, open]);

  const getFiltered = () => {
    if (!search) return courseList;
    const s = search.toLowerCase();
    return courseList.filter(c => c.toLowerCase().includes(s));
  };

  const openThis = () => {
    const ev = new CustomEvent('closeDropdowns', { detail: inputKey });
    window.dispatchEvent(ev);
    setSearch(''); // show ALL courses when reopening
    setOpen(true);
    // highlight current selection
    const idx = courseList.findIndex(c => c === value);
    setHighlighted(idx >= 0 ? idx : 0);
  };

  const handleSelect = (course) => {
    onChange(course);
    setSearch(course);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    setOpen(true);
  };

  const handleKeyDown = (e) => {
    const filtered = getFiltered();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => (h + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => (h - 1 + Math.max(1, filtered.length)) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && filtered.length > 0) handleSelect(filtered[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleBlurValidate = () => {
    if (!search) {
      // nothing typed; keep existing value
      setSearch(value || '');
      return;
    }
    const exact = courseList.find(c => c.toLowerCase() === search.toLowerCase());
    if (exact) {
      handleSelect(exact);
      return;
    }
    // invalid entry - revert to previous valid value or clear
    if (value) setSearch(value);
    else {
      setSearch('');
      onChange('');
    }
  };

  useEffect(() => {
    // ensure highlighted item is visible when it changes; also set sticky state
    if (!open || !listRef.current) return;
    const items = listRef.current.querySelectorAll('.dropdown-item');
    const el = items[highlighted];
    if (el) {
      const rect = el.getBoundingClientRect();
      const listRect = listRef.current.getBoundingClientRect();
      if (rect.bottom > listRect.bottom) {
        el.scrollIntoView({ block: 'end' });
      } else if (rect.top < listRect.top) {
        el.scrollIntoView({ block: 'start' });
      } else {
        el.scrollIntoView({ block: 'nearest' });
      }
      // update sticky state after ensuring visibility
      if (rect.top < listRect.top) setSticky('top');
      else if (rect.bottom > listRect.bottom) setSticky('bottom');
      else setSticky(null);
    }
  }, [highlighted, open]);

  const filtered = getFiltered();

  return (
    <div className="course-dropdown" ref={rootRef}>
      <input
        className="course-input"
        type="text"
        placeholder={disabled ? 'Locked' : placeholder}
        value={open ? search : (search || value || '')}
        onChange={handleInputChange}
        onFocus={() => !disabled && openThis()}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(handleBlurValidate, 150)}
        disabled={disabled}
      />

      {open && !disabled && (
        <div className="dropdown-wrap">
          <ul className="dropdown-list" ref={listRef}>
            {filtered.map((course, idx) => {
              const disabledItem = isSelectedElsewhere && isSelectedElsewhere(course);
              return (
                <li
                  key={course}
                  className={`dropdown-item ${idx === highlighted ? 'highlighted' : ''} ${disabledItem ? 'muted' : ''}`}
                  onMouseDown={(e) => { e.preventDefault(); if (!disabledItem) handleSelect(course); }}
                >
                  {course} <span className="course-category">({availableCourses[course].category})</span>
                </li>
              );
            })}
          </ul>
          {sticky && filtered[highlighted] && (
            <div
              className={`sticky-highlight ${sticky === 'top' ? 'sticky-top' : 'sticky-bottom'}`}
              onMouseDown={(e) => { e.preventDefault(); const course = filtered[highlighted]; if (!isSelectedElsewhere || !isSelectedElsewhere(course)) handleSelect(course); }}
            >
              {filtered[highlighted]} <span className="course-category">({availableCourses[filtered[highlighted]].category})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
