import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


SPEC = importlib.util.spec_from_file_location("wedding_images", Path(__file__).parents[1] / "generate-wedding-images.py")
generator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(generator)


class WeddingGenerationTests(unittest.TestCase):
    def test_ten_distinct_prompts(self):
        self.assertEqual(len(generator.JOBS), 10)
        self.assertEqual(len({slug for slug, _ in generator.JOBS}), 10)

    def test_existing_images_skip_without_api_key(self):
        with patch.object(generator.Path, "exists", return_value=True), patch.dict(os.environ, {}, clear=True), patch("sys.argv", ["generate"]), patch.object(generator.subprocess, "run") as run:
            self.assertEqual(generator.main(), 0)
            run.assert_not_called()

    def test_missing_key_does_not_call_api(self):
        with patch.object(generator.Path, "exists", return_value=False), patch.dict(os.environ, {}, clear=True), patch("sys.argv", ["generate"]), patch.object(generator.subprocess, "run") as run:
            self.assertEqual(generator.main(), 2)
            run.assert_not_called()

    def test_dry_run_selects_one_job_and_cleans_up_after_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            prompt_file = Path(directory) / "prompts.jsonl"
            def fail(command, **kwargs):
                jobs = [json.loads(line) for line in prompt_file.read_text().splitlines()]
                self.assertEqual(len(jobs), 1)
                self.assertEqual(jobs[0]["out"], "luxe-noir.png")
                self.assertEqual(jobs[0]["model"], "gpt-image-2")
                self.assertIn("--dry-run", command)
                self.assertNotIn("--force", command)
                raise RuntimeError("simulated failure")
            with patch.object(generator, "IMAGEGEN", Path(__file__)), patch.object(generator, "PROMPT_FILE", prompt_file), patch.object(generator, "OUTPUT_DIR", Path(directory)), patch("sys.argv", ["generate", "--dry-run", "--only", "luxe-noir"]), patch.object(generator.subprocess, "run", side_effect=fail):
                with self.assertRaisesRegex(RuntimeError, "simulated failure"):
                    generator.main()
            self.assertFalse(prompt_file.exists())


if __name__ == "__main__":
    unittest.main()
