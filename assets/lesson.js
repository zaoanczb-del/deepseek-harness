function lessonAnswer(id, correct, yes, no) {
  const target = document.getElementById(id)
  if (target) target.textContent = correct ? yes : no
}
